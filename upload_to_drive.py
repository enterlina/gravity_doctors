#!/usr/bin/env python3
"""
Google Drive File Upload Script.

This script uploads a local file to Google Drive using the Google Drive API v3.
It uses Google Application Default Credentials (ADC) for authentication.

Prerequisites:
    pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
"""

import argparse
import mimetypes
import os
import google.auth
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

def upload_file(file_path: str, drive_file_name: str = None, mime_type: str = None) -> str:
    """
    Uploads a local file to Google Drive.

    Args:
        file_path: Path to the local file to upload.
        drive_file_name: Optional name for the file in Google Drive. Defaults to the local file's basename.
        mime_type: Optional MIME type of the file. If not provided, it will be guessed.

    Returns:
        The uploaded file's ID if successful, None otherwise.
    """
    if not os.path.exists(file_path):
        print(f"Error: Local file '{file_path}' does not exist.")
        return None

    # Use basename of the file path if drive_file_name is not provided
    if not drive_file_name:
        drive_file_name = os.path.basename(file_path)

    # Guess MIME type if not provided
    if not mime_type:
        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type:
            mime_type = "application/octet-stream"  # Default fallback

    # Load credentials using Google Application Default Credentials (ADC)
    # Ensure GOOGLE_APPLICATION_CREDENTIALS environment variable points to your service account key file,
    # or you have run `gcloud auth application-default login`.
    try:
        creds, _ = google.auth.default(
            scopes=["https://www.googleapis.com/auth/drive.file"]
        )
    except google.auth.exceptions.DefaultCredentialsError as e:
        print("Error acquiring credentials: ", e)
        print("Please ensure your Google Application Default Credentials (ADC) are configured.")
        print("Run: gcloud auth application-default login")
        return None

    try:
        # Build the Drive API service
        service = build("drive", "v3", credentials=creds)

        file_metadata = {
            "name": drive_file_name
        }
        
        media = MediaFileUpload(file_path, mimetype=mime_type, resumable=True)

        print(f"Uploading '{file_path}' ({mime_type}) to Google Drive as '{drive_file_name}'...")
        
        # Execute the file creation request
        file = (
            service.files()
            .create(body=file_metadata, media_body=media, fields="id")
            .execute()
        )
        
        file_id = file.get("id")
        print(f"Successfully uploaded! File ID: {file_id}")
        return file_id

    except HttpError as error:
        print(f"An API error occurred: {error}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Upload a file to Google Drive using Drive API v3.")
    parser.add_argument(
        "--file", 
        required=True, 
        help="Path to the local file to upload."
    )
    parser.add_argument(
        "--name", 
        help="Target name for the file in Google Drive (defaults to local file name)."
    )
    parser.add_argument(
        "--mime", 
        help="MIME type of the file (defaults to auto-detected)."
    )
    
    args = parser.parse_args()
    upload_file(args.file, args.name, args.mime)

if __name__ == "__main__":
    main()
