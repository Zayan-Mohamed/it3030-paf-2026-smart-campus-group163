import os
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_community.document_loaders import (
    DirectoryLoader,
    TextLoader,
    PyPDFLoader,
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from dotenv import load_dotenv

load_dotenv()


def setup_rag(docs_dir: str = "docs"):
    # Create the dir if it doesn't exist just so we don't crash
    if not os.path.exists(docs_dir):
        os.makedirs(docs_dir)

    # We will load any text or md files in the docs directory
    # For actual production, you might want to use PyPDFLoader as well for PDF files.
    print(f"Loading documents from {docs_dir}...")
    # Use a simpler looping approach for PDFs to bypass DirectoryLoader typing issues
    docs = []
    try:
        text_loader = DirectoryLoader(
            docs_dir, glob="**/*.txt", loader_cls=TextLoader, use_multithreading=True
        )
        docs.extend(text_loader.load())
    except Exception as e:
        print(f"Error loading txt files: {e}")

    try:
        pdf_files = [
            os.path.join(docs_dir, f)
            for f in os.listdir(docs_dir)
            if f.endswith(".pdf")
        ]
        for pdf_file in pdf_files:
            loader = PyPDFLoader(pdf_file)
            docs.extend(loader.load())
    except Exception as e:
        print(f"Error loading pdf files: {e}")

    if not docs:
        print(
            f"Warning: No text documents found in {docs_dir}. Generating a dummy one for the pipeline to start."
        )
        with open(os.path.join(docs_dir, "dummy.txt"), "w") as f:
            f.write("Campus IT Manual. Router reset: press red button.")

        fallback_loader = DirectoryLoader(
            docs_dir, glob="**/*.txt", loader_cls=TextLoader, use_multithreading=True
        )
        docs = fallback_loader.load()

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    splits = text_splitter.split_documents(docs)

    print("Initializing local HuggingFace embeddings...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vectorstore = FAISS.from_documents(splits, embeddings)

    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

    llm = ChatGroq(model="llama-3.3-70b-versatile")

    template = """
    You are a knowledgeable AI assistant for the Smart Campus.
    Use the following pieces of retrieved context to answer the question.
    If you don't know the answer, just say that you don't know.
    
    Context:
    {context}
    
    Question: {question}
    
    Answer:
    """
    prompt = PromptTemplate.from_template(template)

    def format_docs(docs_list):
        return "\n\n".join(doc.page_content for doc in docs_list)

    rag_chain = (
        {"context": retriever | format_docs, "question": lambda x: x}
        | prompt
        | llm
        | StrOutputParser()
    )

    return rag_chain


if __name__ == "__main__":
    chain = setup_rag()

    print("\n--- RAG over Campus Knowledge Bases ---")
    question = "What are the requirements for outdoor events"
    print(f"Technician: {question}")
    print("Retrieving manual and generating answer...")

    answer = chain.invoke(question)
    print(f"\nAI Assistant:\n{answer}")
