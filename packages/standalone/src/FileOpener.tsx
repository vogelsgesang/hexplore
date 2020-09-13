import React, {useState} from "react";
import {useDropzone} from "react-dropzone";
import Alert from "react-bootstrap/Alert";
import objstr from "hexplore-hexview/dist/objstr";
import Button from "react-bootstrap/Button";

import "./FileOpener.css";

interface FileOpenerProps {
    setData: (buffer: ArrayBuffer) => void;
}

export function FileOpener({setData}: FileOpenerProps) {
    interface LoadState {
        state: "pristine" | "loading" | "error";
        detail?: string;
    }
    const [loadState, setLoadState] = useState<LoadState>({state: "pristine"});

    function openURL(url: string) {
        setLoadState({state: "loading", detail: 'Downloading "' + url + '"'});
        fetch(url)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.arrayBuffer();
            })
            .then((response) => {
                setLoadState({state: "pristine"});
                setData(response);
            })
            .catch((e) => {
                // Show the error only after some additonal time.
                // Thereby, we make sure that the spinner is visible for at least for a short moment and
                // we don't get an unpleasant "flash" in case the download fails immediately.
                window.setTimeout(
                    () => setLoadState({state: "error", detail: `Unable to load "${url}": ${e.message}`}),
                    200,
                );
            });
    }

    function onDrop(f: File[]) {
        if (f.length != 1) {
            setLoadState({state: "error", detail: `Cannot open multiple files`});
            return;
        }
        const reader = new FileReader();
        reader.onabort = () => setLoadState({state: "error", detail: "Cannot open multiple files"});
        reader.onerror = () => setLoadState({state: "error", detail: "Error opening file"});
        reader.onload = () => {
            setLoadState({state: "pristine"});
            setData(reader.result as ArrayBuffer);
        };
        reader.readAsArrayBuffer(f[0]);
    }

    const [url, setUrl] = useState(window.location.href);

    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop,
    });
    const dropClassName = objstr({
        "hv-drop-zone": true,
        "hv-drop-zone-drag-active": isDragActive,
    });

    if (loadState.state == "loading") {
        return (
            <div className="file-selection-page">
                <div className="hv-spinner" />
                {loadState.detail}
            </div>
        );
    } else {
        let renderedError;
        if (loadState.state == "error") {
            renderedError = (
                <Alert variant="danger" onClose={() => setLoadState({state: "pristine"})} dismissible>
                    {loadState.detail}
                </Alert>
            );
        }
        return (
            <div className="file-selection-page">
                {renderedError}
                <div className="caption">Which file do you want to open?</div>
                <div className="source-alternatives">
                    <form
                        onSubmit={(e) => {
                            openURL(url);
                            e.preventDefault();
                        }}
                        className="source-alternative-url"
                    >
                        <div className="source-caption">Remote file</div>
                        <input aria-label="URL" value={url} onChange={(e) => setUrl(e.target.value)} />
                        <Button type="submit" size="sm" block>
                            Open URL
                        </Button>
                    </form>
                    <div>
                        <div className="source-caption">Local file</div>
                        <div {...getRootProps({className: dropClassName})}>
                            <input {...getInputProps()} />
                            {isDragActive ? (
                                "Drop the file here ..."
                            ) : (
                                <React.Fragment>
                                    Drag &apos;n&apos; drop your file here, or click to select files
                                </React.Fragment>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
