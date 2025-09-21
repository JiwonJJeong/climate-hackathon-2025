#!/usr/bin/env python3
"""
Simple script to run the FastAPI server
"""
import uvicorn

if __name__ == "__main__":
    print("🚀 Starting Climate Hackathon 2025 FastAPI Backend...")
    print("📋 Available endpoints:")
    print("   GET  http://localhost:2003/")
    print("   GET  http://localhost:2003/health") 
    print("   POST http://localhost:2003/api/upload")
    print("   GET  http://localhost:2003/docs (Interactive API docs)")
    print("=" * 50)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=2003,
        reload=True,
        log_level="info"
    )
