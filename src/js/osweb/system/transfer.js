import WebFont from 'webfontloader'
import { readFileAsText, parseUrl } from '../util/files'
import isString from 'lodash/isString'
import isObject from 'lodash/isObject'
import axios from 'axios'

/** Class representing a information stream processor. */
export default class Transfer {
  /**
   * Create a transfer object used for streaming information.
   * @param {Object} runner - The runner class to which the transfer belongs.
   */
  constructor (runner) {
    this._runner = runner
  }

  /**
   * This is the top-level function that is called by the runner to load the
   * experiment file, pool files included with the experiment file, pool files
   * included as HTML elements, and web fonts.
   * @param {Object|String} source - A file object or a String containing the 
   *                                 experiment or a download URL.
   */
  async _readSource (source) {
    // Check type of object.
    if (!isString(source) && (!isObject(source) || source.constructor !== File)) {
      throw new Error('No osexp source file defined.')
    }
    // This var will hold the OS script after parsing
    let osScript
    if (source.constructor === File) {
      // Source is a local file.
      try {
        osScript = await this._readExpFile(source)
      } catch (e) {
        throw new Error(`Could not read local osexp, ${e}`)
      }
    } else if (isString(source)) {
      // Check if the source string is an URL
      const uri = parseUrl(source)

      if (uri !== false) {
        // Attempt to download and load the remote experiment
        try {
          const remoteFile = await this.fetch(uri.href)
          osScript = await this._readExpFile(remoteFile)
        } catch (e) {
          throw new Error(`Could not read remote osexp, ${e}`)
        }
      } else {
        try {
          osScript = this._processScript(source)
        } catch (e) {
          throw new Error(`Could not read source string, ${e}\n\n${source}`)
        }
      }
    }
    this._readPoolElements()
    await this._readWebFonts()
    return osScript
  }

  /**
   * Reads in an osexp from a string
   *
   * @param {File|String} osexpFile The osexp to parse, can be a string or a File containing a string
   * @returns boolean
   * @memberof Transfer
   */
  async _readExpFile (osexp) {
    if ([File, Blob].includes(osexp.constructor)) {
      osexp = await readFileAsText(osexp)
    }
    return this._processScript(osexp)
  }

  /**
   * Reads an osexp file from a remote server, if its type is indicated to be
   * 'text/plain' (opposed to being zipped)
   * @param  {string} url The url at which the osexp can be found
   * @return {void}
   */
  async fetch (url) {
    const response = await axios.get(url, {
      responseType: 'blob',
      onDownloadProgress: (event) => {
        if (event.lengthComputable) {
          this._runner._screen._updateProgressBar(event.loaded / event.total)
        }
      }
    })
    let res
    if (/Edge/.test(navigator.userAgent)) {
      res = new Blob([response.data])
      res.name = 'downloaded.osexp'
    } else {
      res = new File([response.data], 'downloaded.osexp')
    }
    return res
  }

  /**
   * Process an osexp script
   * @param  {string} contents - The script contents
   * @return {boolean} - True if script was successfully processed, false otherwise
   */
  _processScript (contents) {
    if (contents.substr(0, 3) !== '---') {
      throw new Error('Specified script file is not valid OpenSesame script')
    }

    // Disable the progressbar.
    this._runner._screen._updateProgressBar(100)
    // Set the script paramter.
    // this._runner._script = contents
    return contents
  }
  
 /**
   * If file-pool assets are included as HTML elements, they are added to the
   * file pool here.
   *
   * @returns Promise
   * @memberof Transfer
   */
  _readPoolElements () {
    const filePool = document.getElementById('filePool')
    if (filePool === null) {
      console.log('file pool not embedded in HTML')
      return
    }
    console.log('file pool embedded in HTML')
    let item
    for (const asset of filePool.children) {
      item = {data: null, type: 'undefined'}
      console.log(asset.id)
      if (asset instanceof HTMLImageElement) {
        console.log('image')
        item.data = asset
        item.type = 'image'
      } else if (asset instanceof HTMLAudioElement) {
        console.log('audio')
        item.data = asset
        item.type = 'audio'
      } else if (asset instanceof HTMLVideoElement) {
        console.log('video')
        item.data = asset
        item.type = 'video'
      } else if (asset instanceof HTMLPreElement) {
        console.log('text')
        item.data = asset.innerText
        item.type = 'text'
      } else {
        console.log(`unknown pool element: ${asset}`)
        continue
      }
      console.log('adding asset to file pool')
      console.log(item)
      this._runner._pool.add(item, asset.id)
    }
  }

  /**
   * Read in webfonts
   *
   * @returns Promise
   * @memberof Transfer
   */
  async _readWebFonts () {
    // Update the introscreen
    this._runner._screen._updateProgressBar(100)
    this._runner._screen._updateIntroScreen('Retrieving required webfonts.')

    return new Promise((resolve, reject) => {
      // Load the required fonts using webfont.
      WebFont.load({
        google: {
          families: ['Droid Sans', 'Droid Serif', 'Droid Sans Mono'],
          urls: ['//fonts.googleapis.com/css?family=Droid Sans',
            '//fonts.googleapis.com/css?family=Droid Serif',
            '//fonts.googleapis.com/css?family=Droid Sans Mono'
          ]
        },
        active: () => resolve(),
        inactive: () => reject(new Error('Could not load webfonts'))
      })
    })
  }
}
