import os
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template
from bs4 import BeautifulSoup

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    # Map raw RSS categories to frontend theme-friendly names
    TYPE_MAPPING = {
        'Breaking': 'Deprecation',
        'Change': 'Update'
    }
    
    # Fetch the XML feed
    req = urllib.request.Request(
        FEED_URL, 
        headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)'}
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        xml_data = response.read()
        
    # Standard namespace mapping for Atom feed
    namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
    root = ET.fromstring(xml_data)
    
    updates = []
    update_id_counter = 0
    
    for entry in root.findall('atom:entry', namespaces):
        # Date string from <title>
        date_elem = entry.find('atom:title', namespaces)
        date_str = date_elem.text.strip() if date_elem is not None else "Unknown Date"
        
        # ISO timestamp from <updated>
        updated_elem = entry.find('atom:updated', namespaces)
        updated_str = updated_elem.text.strip() if updated_elem is not None else ""
        
        # URL link from <link rel="alternate">
        link_elem = entry.find("atom:link[@rel='alternate']", namespaces)
        link_url = link_elem.attrib['href'] if link_elem is not None else ''
        
        # Raw HTML content inside <content>
        content_elem = entry.find('atom:content', namespaces)
        content_html = content_elem.text if content_elem is not None else ''
        
        if not content_html:
            continue
            
        soup = BeautifulSoup(content_html, 'html.parser')
        h3_tags = soup.find_all('h3')
        
        # Fallback if there are no H3 tags (treat the whole content as one update)
        if not h3_tags:
            text_content = soup.get_text().strip()
            updates.append({
                'id': f"up_{update_id_counter}",
                'date': date_str,
                'updated': updated_str,
                'link': link_url,
                'type': 'Update',
                'html': content_html,
                'text': text_content
            })
            update_id_counter += 1
            continue
            
        # Segment the update items based on H3 headers (e.g. Feature, Issue, Announcement)
        current_type = None
        current_elems = []
        
        for child in soup.contents:
            if child.name == 'h3':
                # Save the accumulated elements for the previous H3 group
                if current_type and current_elems:
                    html_snippet = "".join(str(el) for el in current_elems)
                    text_snippet = BeautifulSoup(html_snippet, 'html.parser').get_text().strip()
                    updates.append({
                        'id': f"up_{update_id_counter}",
                        'date': date_str,
                        'updated': updated_str,
                        'link': link_url,
                        'type': current_type,
                        'html': html_snippet,
                        'text': text_snippet
                    })
                    update_id_counter += 1
                raw_type = child.get_text().strip()
                current_type = TYPE_MAPPING.get(raw_type, raw_type)
                current_elems = []
            elif current_type:
                current_elems.append(child)
                
        # Append the final group
        if current_type and current_elems:
            html_snippet = "".join(str(el) for el in current_elems)
            text_snippet = BeautifulSoup(html_snippet, 'html.parser').get_text().strip()
            updates.append({
                'id': f"up_{update_id_counter}",
                'date': date_str,
                'updated': updated_str,
                'link': link_url,
                'type': current_type,
                'html': html_snippet,
                'text': text_snippet
            })
            update_id_counter += 1
            
    return updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    try:
        notes = fetch_and_parse_feed()
        return jsonify({
            'success': True,
            'data': notes
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
