import openai
try:
    client = openai.OpenAI(api_key="test")
    if hasattr(client, "responses"):
        print("client.responses EXISTS")
    else:
        print("client.responses DOES NOT EXIST")
        print(f"Available attributes: {dir(client)}")
except Exception as e:
    print(f"Error: {e}")
