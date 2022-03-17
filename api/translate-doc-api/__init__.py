import base64
import logging
from nturl2path import url2pathname
import os, uuid, sys
import json, random, string
import azure.functions as func
# from azure.common import AzureException
from azure.storage.blob import BlobClient
import requests

def get_blob_base_url_from_connection_string():
    
    connect_str = os.environ["AzureWebJobsStorage"]
    connect_str_parts = connect_str.split(";")

    url_DefaultEndpointsProtocol = connect_str_parts[0].split("=")[1] # DefaultEndpointsProtocol
    url_AccountName = connect_str_parts[1].split("=")[1] # AccountName
    url_EndpointSuffix = connect_str_parts[3].split("=")[1] # EndpointSuffix

    url_storage = f"{url_DefaultEndpointsProtocol}://{url_AccountName}.blob.{url_EndpointSuffix}"
    return url_storage

def translate_doc(filename, lang_from, lang_to):
    TRANSLATOR_DOCU_ENDPOINT = os.environ["TRANSLATOR_DOCU_ENDPOINT"] 
    endpoint = f"{TRANSLATOR_DOCU_ENDPOINT}translator/text/batch/v1.0"
    subscriptionKey =  os.environ["TRANSLATOR_TEXT_SUBSCRIPTION_KEY"]
    path = '/batches'
    constructed_url = endpoint + path

    payload= {
        "inputs": [
            {
                "storageType": "File",
                "source": {
                    "sourceUrl": f"{get_blob_base_url_from_connection_string()}/src/{filename}",
                    "language": lang_from
                },
                "targets": [
                    {
                        "targetUrl": f"{get_blob_base_url_from_connection_string()}/tgt/{filename}-{lang_to}.docx",
                        "language": lang_to
                    },
                ]
            }
        ]
    }
    headers = {
    'Ocp-Apim-Subscription-Key': subscriptionKey,
    'Content-Type': 'application/json'
    }

    response = requests.post(constructed_url, headers=headers, json=payload)

    print(f'response status code: {response.status_code}\nresponse status: {response.reason}\nresponse headers: {response.headers}')
    return payload["inputs"][0]["targets"][0]["targetUrl"]

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    # checking for a POST request.

     # # This is the call to the Form Recognizer endpoint
    connect_str = os.environ["AzureWebJobsStorage"]
    blob_container = os.environ["AzureWebJobsStorageContainer"]

    # connect_str_parts = connect_str.split(";")
    # url_DefaultEndpointsProtocol = connect_str_parts[0].split("=")[1] # DefaultEndpointsProtocol
    # url_AccountName = connect_str_parts[1].split("=")[1] # AccountName
    # url_EndpointSuffix = connect_str_parts[3].split("=")[1] # EndpointSuffix

    # url_storage = f"{url_DefaultEndpointsProtocol}://{url_AccountName}.blob.{url_EndpointSuffix}"
    url_storage = get_blob_base_url_from_connection_string()

    # logging.info(req.get_json())
    for input_file in req.files.values():
        filename = input_file.filename
        contents = input_file.stream.read()

        logging.info('Filename: %s' % filename)
        # logging.info('Contents:')
        # logging.info(contents)

        # Storage connection string
        blob = BlobClient.from_connection_string(conn_str=connect_str, container_name=blob_container, blob_name=filename)
        logging.info("Successful connection to blob storage.")

        #upload to picture to blob storage
        # block_blob_service = BlockBlobService(account_name=accuntName, account_key=accuntKey)
        # blob_service_client  = BlobServiceClient(connection_string = connect_str)
        # service = BlobServiceClient.from_connection_string(conn_str=connect_str)
        # container_name = 'machineimages'
        # blob_name = filename
        # Creating the blob
        # service.create_blob_from_bytes(container_name, blob_name, contents,
        #     content_settings=ContentSettings(content_type='application/octet-stream'))
        blob.upload_blob(contents)
        logging.info("Successfull blob creating ")


        translated_doc_url = translate_doc(filename=filename, lang_from="en", lang_to="es")
        
        response = {
            "original-filename": filename,
            "translated-filename": filename, # TODO
            "fileurl": translated_doc_url,
        }
        ret = json.dumps(response, sort_keys=True, indent=4, separators=(',', ': '))
        return func.HttpResponse(
                ret,
                status_code=200
        )
