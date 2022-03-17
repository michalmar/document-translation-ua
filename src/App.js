import React, { useState } from 'react';

function App() {

  // current file to upload into container
  const [fileSelected, setFileSelected] = useState(null);
  const [text, setText] = useState("Привіт Люба");
  const [uploading, setUploading] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [processedDocument, setProcessedDocument] = useState(false);
  const [inputKey, setInputKey] = useState(Math.random().toString(36));

  const [translatedResults, setTranslatedResults] = useState(null);
  const [translatedFiles, setTranslatedFiles] = useState(null);

  const onTextChange = (event) => {
    // capture file into state
    setText(event.target.value);
  };

  const onFileChange = (event) => {
    // capture file into state
    setFileSelected(event.target.files[0]);
  };

  const onFileUpload = async () => {
    // prepare UI
    setUploading(true);
    setProcessedDocument(false);

    // // *** UPLOAD TO AZURE STORAGE ***
    // // const blobsInContainer = await uploadFileToBlob(fileSelected);

    // *** SEND FILE TO Azure Functions ***
    var formdata = new FormData();
    formdata.append("file", fileSelected, fileSelected.name);

    var requestOptions = {
      method: 'POST',
      body: formdata,
      redirect: 'follow'
    };


    await fetch("/api/translate-doc-api", requestOptions)
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `This is an HTTP error: The status is ${response.status}`
            );
          }
          return response.json();
          
        })
        .then((data) => setTranslatedFiles(data))
        .catch(error => console.log('error', error));

    setProcessedDocument(true)

    // reset state/form
    setFileSelected(null);
    setUploading(false);
    setInputKey(Math.random().toString(36));
  };

  const onTranslate = async () => {
    // prepare UI
    setUploading(true);
    setProcessed(false);

    // *** SEND TEXT TO Azure Functions ***

    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "text/plain");

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: '{"text": "'+text+'"}',
      redirect: 'follow'
    };
    
    await fetch("/api/translate-text-api", requestOptions)
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `This is an HTTP error: The status is ${response.status}`
            );
          }
          return response.json();
          
        })
        .then((data) => setTranslatedResults(data))
        .catch(error => console.log('error', error));
    // console.log(translatedResults)
    setProcessed(true)

    // reset state/form
    setFileSelected(null);
    setUploading(false);
    setInputKey(Math.random().toString(36));
  }

  const DisplayTranslationResults = () => ( 
    <div>
      Translated: {translatedResults[0].translations[0].text}
    </div>
  )
  const DisplayTranslationDocumentResults = () => ( 
    <div>
      Translated Document: 
        {translatedFiles.fileurl}
        {translatedFiles.original_filename}
        {translatedFiles.translated_filename}
    </div>
  )
  const DisplayProcessingMessage = () => ( 
    <div>
      Translation in progress... 
    </div>
  )
  const render = () => (
      <div className="columns is-centered">
        <div className="column is-half">
          <div className="content mt-4">
            <h5 className="title is-5">Info</h5>
            <p><strong>Translator</strong> služby Azure Congnitive Sevices.</p>
            <p>Text v poli níže můžete nahradit libovolným jiným textem.</p>
          </div>
          <div className="field mb-5">
            <label className="label">Text k překladu</label>
            <div className="control">
              <textarea
                className="textarea"
                placeholder="Textarea"
                onChange={onTextChange}
                value={text}
              />
            </div>
          </div>
          <div className="field is-grouped mb-6"> 
            <div className="control is-align-self-flex-end">
              <button
                className="button is-primary"
                aria-label="Syntetizovat text"
                onClick={onTranslate}
                disabled={uploading}
              >
                Přeložit
              </button>
            </div>
          </div>

          <div className="field mb-5">
              <label className="label">Nahrajte fakturu (*.pdf)</label>
              <div className="control">
                <input name="file" type="file" onChange={onFileChange} key={inputKey || ''} />
                <button type="submit" onClick={onFileUpload}>
                  Upload!
                </button>
              </div>
          </div>
  
          <div className="content">
            <h5 className="title is-5">Historie</h5>
            {processed && DisplayTranslationResults()}
          </div>

          <div className="content">
            <h5 className="title is-5">Historie</h5>
            {processedDocument && DisplayTranslationDocumentResults()}
          </div>

          <div className="content">
            <h5 className="title is-5">Historie</h5>
            {uploading && DisplayProcessingMessage()}
          </div>

        </div>
      </div>
  )
  return render();
}

export default App;
