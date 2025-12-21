#!/usr/bin/env python3
import requests
import json

# Call the test data creation endpoint
url = "http://localhost:3000/api/test/create-forum-data"

try:
    response = requests.post(url)
    data = response.json()
    
    print("✅ Test data created successfully!")
    print(f"\nUser Credentials:")
    print(f"  Email: {data.get('user', {}).get('email')}")
    print(f"  Handle: {data.get('user', {}).get('handle')}")
    print(f"\nForum Thread:")
    print(f"  Title: {data.get('thread', {}).get('title')}")
    print(f"  URL: http://localhost:3000{data.get('thread', {}).get('url')}")
    print(f"\n📝 Full response:")
    print(json.dumps(data, indent=2))
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("Make sure the dev server is running on http://localhost:3000")
