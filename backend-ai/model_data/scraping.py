import requests

def fetch_openphish_urls():
    # The official free feed URL from OpenPhish
    url = "https://openphish.com/feed.txt"
    
    print(f"Connecting to {url}...")
    
    try:
        # Send a GET request to the feed
        response = requests.get(url, timeout=10)
        
        # Check if the request was successful
        if response.status_code == 200:
            urls = response.text.splitlines()
            print(f"Successfully fetched {len(urls)} malicious URLs.")
            
            # Save to a file
            filename = "malicious_urls.txt"
            with open(filename, "w") as f:
                f.write(response.text)
                
            print(f"Data saved to '{filename}'.")
            
            # Preview the first 5 URLs
            print("\n--- Preview of Fetched URLs ---")
            for i in range(5):
                if i < len(urls):
                    print(urls[i])
            print("-------------------------------")
            
        else:
            print(f"Failed to fetch data. Status Code: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    fetch_openphish_urls()
