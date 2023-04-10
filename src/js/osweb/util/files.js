import isFunction from 'lodash/isFunction'

/**
 * FileStreamer makes it possible to asynchronously stream a file to another reader
 *
 * @class FileStreamer
 */
class FileStreamer {
  constructor (file, chunkSize = 64 * 1024) {
    this.file = file
    this.offset = 0
    this.chunkSize = chunkSize // bytes
    this.rewind()
  }

  rewind () {
    this.offset = 0
  }

  isEndOfFile () {
    return this.offset >= this.getFileSize()
  }

  readBlock () {
    const fileReader = new FileReader()
    const blob = this.file.slice(this.offset, this.offset + this.chunkSize)

    return new Promise((resolve, reject) => {
      fileReader.onloadend = (event) => {
        const target = (event.target)
        if (target.error) {
          return reject(target.error)
        }

        this.offset += target.result.byteLength

        resolve({
          data: target.result,
          progress: Math.min(this.offset / this.file.size, 1)
        })
      }

      fileReader.readAsArrayBuffer(blob)
    })
  }

  getFileSize () {
    return this.file.size
  }
}

/**
 * Converts a File/Blob to a string representation
 *
 * @export
 * @param {File} inputFile The file to convert
 * @returns string
 */
export function readFileAsText (inputFile) {
  const temporaryFileReader = new FileReader()

  return new Promise((resolve, reject) => {
    temporaryFileReader.onerror = () => {
      temporaryFileReader.abort()
      reject(new DOMException('Problem parsing input file.'))
    }

    temporaryFileReader.onload = () => {
      resolve(temporaryFileReader.result)
    }
    temporaryFileReader.readAsText(inputFile)
  })
}

/**
 * Returns current host as detected by browser
 *
 * @returns String
 */
function getHost () {
  return window.location.origin !== 'null' ? window.location.origin : 'http://nodejs.test'
}

/**
 * Checks if the passed string contains a valid URL
 *
 * @export
 * @param {String} str The string to check
 * @returns boolean
 */
export function parseUrl (str) {
  try {
    const host = getHost()
    return new URL(str, host)
  } catch (e) {
    return false
  }
}
