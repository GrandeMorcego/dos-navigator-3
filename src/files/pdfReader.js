import React from 'react';
import pdfjsLib from 'pdfjs-dist';

export default class PdfReader extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }

    componentDidMount() {
        // let pdf = pdfjsLib.
        let pdf = pdfjsLib.getDocument(this.props.data);
        pdf.then((pdfDocument) => {
            return pdfDocument.getPage(1).then((page) => {
                let viewport = page.getViewport(1.0);
                let canvas = document.getElementById("pdf-canvas");
                canvas.style.width= viewport.width;
                canvas.style.height = viewport.heigth;

                let ctx = canvas.getContext("2d");

                let renderer = page.render({
                    canvasContext: ctx,
                    viewport: viewport
                })

                return renderer;
            })
        })
    }

    render() {
        return (
            <canvas id="pdf-canvas">

            </canvas>
        );
    }
}