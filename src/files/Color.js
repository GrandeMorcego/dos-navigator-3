let colors = {
    ".JS": '#00E676',
    ".SH": "#9FA8DA"
}

export default function setFileColor(fileExt, fileIsDir) {
    if (colors[fileExt] && !fileIsDir) {
        return colors[fileExt]
    } else if (fileIsDir || !colors[fileExt]) {
        return '#ffffff'
    }
}
