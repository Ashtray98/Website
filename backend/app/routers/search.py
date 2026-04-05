"""Search Router - Semantic search over knowledge base"""
import re
from fastapi import APIRouter, Query, HTTPException
from spellchecker import SpellChecker
from app.models import SearchResponse, SearchResult
from app.services import embedder, vectorstore

router = APIRouter(prefix="/api", tags=["search"])


@router.get("/search", response_model=SearchResponse)
async def semantic_search(
    q: str = Query(..., description="Natural language search query"),
    top_k: int = Query(5, ge=1, le=20, description="Number of results to return"),
):
    """
    Perform semantic search over the knowledge base.
    Embeds the query and retrieves top-K most relevant chunks via cosine similarity.
    """
    if not q.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        # Spell check logic
        spell = SpellChecker()
        words = q.split()
        misspelled = spell.unknown(words)
        did_you_mean = None
        
        if misspelled:
            corrected_query = []
            for word in words:
                if word in misspelled:
                    suggestion = spell.correction(word)
                    corrected_query.append(suggestion if suggestion else word)
                else:
                    corrected_query.append(word)
            
            potential_correction = " ".join(corrected_query)
            if potential_correction.lower() != q.lower():
                did_you_mean = potential_correction
        # 1. Year Detection (Keyword layer)
        query_years = set(re.findall(r'\b(20\d{2})\b', q))

        # 2. Vector Search
        raw_results = vectorstore.search(query_embedding, top_k=top_k)

        # 3. Hybrid Scoring and Filtering
        results = []
        for r in raw_results:
            text = r["chunk_text"]
            score = r["score"]
            
            # Extract years from the chunk text
            chunk_years = set(re.findall(r'\b(20\d{2})\b', text))
            
            # --- Year-Aware Boosting/Filtering ---
            if query_years:
                # If chunk has no year info, it's neutral, but if it has WRONG year info, it's penalized
                matching_years = query_years.intersection(chunk_years)
                conflicting_years = chunk_years.difference(query_years)
                
                if matching_years:
                    # Boost results that explicitly mention the requested year
                    score += 0.05
                elif conflicting_years:
                    # Heavily penalize results that discuss the WRONG year (prevent hallucinations)
                    score -= 0.15
            
            # --- Standard Quality Thresholds ---
            if score < 0.12: # Adjusted threshold for hybrid scores
                continue
                
            if re.search(r'(.)\1{12,}', text) or re.search(r'(.{2,4}?)\1{8,}', text):
                continue

            if text.count('\ufffd') >= 2:
                continue

            meta = r.get("metadata", {})
            results.append(SearchResult(
                chunk_text=r["chunk_text"],
                source_document=meta.get("source", "Unknown"),
                source_type=meta.get("source_type", "Unknown"),
                score=r["score"],
                chunk_index=meta.get("chunk_index", 0),
                metadata=meta,
            ))

        return SearchResponse(
            query=q,
            results=results,
            total_results=len(results),
            did_you_mean=did_you_mean
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
