"""LLM Service - RAG-based Q&A using retrieved context"""
from datetime import datetime
from app.config import settings


def generate_answer(query: str, context_chunks: list[dict], conversation_history: list[dict] = None) -> dict:
    """
    Generate an answer using retrieved context.
    Demo mode: template-based response.
    Production mode: OpenAI GPT.
    """
    if settings.USE_OPENAI and settings.OPENAI_API_KEY:
        return _generate_openai(query, context_chunks, conversation_history)
    else:
        return _generate_demo(query, context_chunks, conversation_history)


def _generate_demo(query: str, context_chunks: list[dict], conversation_history: list[dict] = None) -> dict:
    """Generate a demo response using template-based approach with real context."""
    if not context_chunks:
        return {
            "answer": "I couldn't find any relevant information in the knowledge base to answer your question. Please try uploading relevant documents first, or rephrase your query.",
            "sources": [],
            "confidence": 0.0,
        }

    # Build context from retrieved chunks
    context_parts = []
    sources = []
    seen_sources = set()

    for i, chunk in enumerate(context_chunks[:5]):
        chunk_text = chunk.get("chunk_text", "")
        metadata = chunk.get("metadata", {})
        score = chunk.get("score", 0)
        source_name = metadata.get("source", "Unknown")

        context_parts.append(f"[Source {i+1}: {source_name}]\n{chunk_text}")

        if source_name not in seen_sources:
            seen_sources.add(source_name)
            sources.append({
                "document_name": source_name,
                "chunk_text": chunk_text[:300] + ("..." if len(chunk_text) > 300 else ""),
                "relevance_score": score,
            })

    combined_context = "\n\n---\n\n".join(context_parts)

    # Build a synthesized answer from the context
    top_chunk = context_chunks[0]
    top_text = top_chunk.get("chunk_text", "")
    top_source = top_chunk.get("metadata", {}).get("source", "the knowledge base")
    avg_score = sum(c.get("score", 0) for c in context_chunks) / len(context_chunks)

    # Create a structured answer
    answer_parts = [
        f"Based on the information retrieved from your knowledge base, here's what I found relevant to your query:\n",
        f"**From {top_source}:**\n",
        f"{top_text[:500]}",
    ]

    if len(context_chunks) > 1:
        answer_parts.append(f"\n\n**Additional relevant information** was found in {len(context_chunks) - 1} other source(s):")
        for chunk in context_chunks[1:3]:
            src = chunk.get("metadata", {}).get("source", "Unknown")
            txt = chunk.get("chunk_text", "")[:200]
            answer_parts.append(f"\n- *{src}*: {txt}...")

    answer_parts.append(f"\n\n> 💡 *This response is generated in demo mode using retrieved context. Connect an OpenAI API key for AI-synthesized answers.*")

    return {
        "answer": "\n".join(answer_parts),
        "sources": sources,
        "confidence": round(avg_score, 3),
    }


def _generate_openai(query: str, context_chunks: list[dict], conversation_history: list[dict] = None) -> dict:
    """Generate response using OpenAI GPT with RAG context."""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        # Build context with citation indices
        context_parts = []
        sources = []
        seen_sources = set()

        for i, chunk in enumerate(context_chunks[:5]):
            chunk_text = chunk.get("chunk_text", "")
            metadata = chunk.get("metadata", {})
            score = chunk.get("score", 0)
            source_name = metadata.get("source", "Unknown")

            # Explicitly index each chunk as a source for the AI to cite
            context_parts.append(f"--- [Source {i+1}: {source_name}] ---\n{chunk_text}")

            if source_name not in seen_sources:
                seen_sources.add(source_name)
                sources.append({
                    "document_name": source_name,
                    "chunk_text": chunk_text[:300] + ("..." if len(chunk_text) > 300 else ""),
                    "relevance_score": score,
                })

        context = "\n\n".join(context_parts)

        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        system_prompt = f"""
You are an intelligent document assistant for an organization's internal file retrieval system.
The current date and time is {current_time}.

You will be given relevant document chunks and a user question. Your job is to answer accurately using only the provided context.
IMPORTANT: When the context contains information that is still valid but written in the past tense (e.g., 'Project X was scheduled for 2024'), and the current date confirms it has passed or is ongoing, you should adapt your response to reflect the current reality (e.g., using present or past-perfect tense appropriately) relative to the current date.

Always respond in this exact format:

ANSWER:
Provide a complete, well-structured answer using bullet points for key details and facts.
Base your response strictly on the retrieved document context.
If a specific year (e.g., 2022) is in the question, check all sources for that year.
DANGER: If no information for the requested year exists in the sources, state: "I searched the knowledge base but found no data for [Year]." Do NOT use data from other years (e.g., 2024, 2025) as a substitute.
If you use multiple sources, state which information came from which source.
CRITICAL: Use inline bracketed markers like [Source 1] at the end of sentences or bullet points.
If the context does not contain enough information, clearly state that.

SUMMARY:
Write exactly 8-9 lines summarizing the answer above.
Each line must be a single, clear, standalone sentence.
Cover the key points in order of importance.
Do not use bullet points or numbering.
Write in a professional tone suitable for organizational use.
"""

        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history
        if conversation_history:
            for msg in conversation_history[-6:]:  # Last 3 exchanges
                messages.append(msg)

        messages.append({
            "role": "user",
            "content": f"Document Context (Use these for citations [Source X]):\n{context}\n\nQuestion: {query}\n\nRespond strictly in the ANSWER: and SUMMARY: format with [Source X] citations."
        })

        response = client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=messages,
            temperature=0.2, # Lower temperature for better grounding/precision
            max_tokens=1500,
        )

        answer = response.choices[0].message.content
        avg_score = sum(c.get("score", 0) for c in context_chunks) / len(context_chunks) if context_chunks else 0

        return {
            "answer": answer,
            "sources": sources,
            "confidence": round(avg_score, 3),
        }

    except Exception as e:
        print(f"[DATA-WEAVE] OpenAI generation failed: {e}")
        return _generate_demo(query, context_chunks, conversation_history)
