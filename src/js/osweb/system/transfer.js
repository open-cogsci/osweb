import WebFont from 'webfontloader'
import { getAudioContext } from './audio_context'
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
    await this._readPoolElements()
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
    const response = await axios.get(url, { responseType: 'blob' })
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
    return contents
  }
  
  /**
   * If file-pool assets are included as HTML elements, they are added to the
   * file pool here.
   *
   * @returns Promise
   * @memberof Transfer
   */
  async _readPoolElements() {
      const filePool = document.getElementById('filePool')
      if (filePool === null) {
          console.log('file pool not embedded in HTML')
          return
      }
      console.log(`file pool embedded in HTML (${filePool.children.length} files)`)
      // First we process the images, videos, and text, which do not require
      // promises
      for (const asset of filePool.children) {
          if (asset instanceof HTMLImageElement) {
              this._runner._pool.add({ data: asset, type: 'image' }, asset.id)
          } else if (asset instanceof HTMLVideoElement) {
              this._runner._pool.add({ data: asset, type: 'video' }, asset.id)
          } else if (asset instanceof HTMLPreElement) {
              this._runner._pool.add({ data: asset.innerText, type: 'text' }, asset.id)
          } else {
              console.log(`unknown pool element: ${asset}`)
              continue
          }
      }

      // Example snippet with retry logic (fixed 'this' context)
      const BATCH_SIZE = 10;
      const audioContext = getAudioContext();
      
      // Helper function that retries an audio fetch on network errors
      function loadAudioDataWithRetry(audioContext, audioSrc, assetId, attempt = 1, maxAttempts = 3, delay = 5000) {
        // Capture "this"
        const self = this;
      
        return new Promise((resolve, reject) => {
          // Handle Base64 encoded data
          if (audioSrc.startsWith('data:')) {
            try {
              const base64String = audioSrc.split(',')[1];
              const audioData = atob(base64String);
              const audioArray = new Uint8Array(audioData.length);
              for (let i = 0; i < audioData.length; i++) {
                audioArray[i] = audioData.charCodeAt(i);
              }
              const audioBuffer = new ArrayBuffer(audioArray.length);
              const bufferView = new Uint8Array(audioBuffer);
              bufferView.set(audioArray);
      
              audioContext.decodeAudioData(audioBuffer, function (buffer) {
                self._runner._pool.add({ data: buffer, type: 'audioBuffer' }, assetId);
                resolve();
              }, function (error) {
                console.error('Error decoding audio:', error);
                reject(error);
              });
            } catch (error) {
              console.error('Error processing Base64 audio:', error);
              reject(error);
            }
          } else {
            // Standard URI request
            const request = new XMLHttpRequest();
            request.open('GET', audioSrc, true);
            request.responseType = 'arraybuffer';
      
            request.onload = function () {
              // Check for HTTP success (200-299)
              if (request.status >= 200 && request.status < 300) {
                audioContext.decodeAudioData(request.response, function (buffer) {
                  self._runner._pool.add({ data: buffer, type: 'audioBuffer' }, assetId);
                  resolve();
                }, function (decodeError) {
                  console.error('Error decoding audio:', decodeError);
                  reject(decodeError);
                });
              } else {
                if (attempt < maxAttempts) {
                  console.warn(`Audio request failed for ${audioSrc} (status: ${request.status}). Retrying in ${delay}ms...`);
                  setTimeout(() => {
                    loadAudioDataWithRetry.call(self, audioContext, audioSrc, assetId, attempt + 1, maxAttempts, delay)
                      .then(resolve)
                      .catch(reject);
                  }, delay);
                } else {
                  reject(new Error(`Max retries reached. Request for ${audioSrc} failed with status: ${request.status}.`));
                }
              }
            };
      
            request.onerror = function () {
              if (attempt < maxAttempts) {
                console.warn(`Network error on audio request for ${audioSrc}. Retrying in ${delay}ms...`);
                setTimeout(() => {
                  loadAudioDataWithRetry.call(self, audioContext, audioSrc, assetId, attempt + 1, maxAttempts, delay)
                    .then(resolve)
                    .catch(reject);
                }, delay);
              } else {
                reject(new Error(`Max retries reached. Network error fetching ${audioSrc}.`));
              }
            };
      
            request.send();
          }
        });
      }
      
      // Filter children to include only HTMLAudioElements or <span class="audioFile">
      const filteredChildren = [...filePool.children].filter(asset =>
        asset instanceof HTMLAudioElement ||
        (asset instanceof HTMLSpanElement && asset.className === 'audioFile')
      );
      
      for (let i = 0; i < filteredChildren.length; i += BATCH_SIZE) {
        // Take a slice of the array
        const batch = filteredChildren.slice(i, i + BATCH_SIZE);
        console.log(`Fetching audio files ${i} - ${i + BATCH_SIZE}`);
        // Build promises for just the current batch
        const batchPromises = batch.map(asset => {
          let audioSrc;
          if (asset instanceof HTMLAudioElement) {
            audioSrc = asset.querySelector('source').src;
          } else {
            // Assumes textContent points to the file for <span class="audioFile">
            audioSrc = asset.textContent;
          }
          // Use the retry function
          return loadAudioDataWithRetry.call(this, audioContext, audioSrc, asset.id);
        });
      
        // Await them all before moving on to the next batch
        await Promise.all(batchPromises);
      }

      console.log("All audio files have been loaded and decoded");    
  }
  

  /**
   * Read in webfonts
   *
   * @returns Promise
   * @memberof Transfer
   */
  async _readWebFonts () {
    // Update the introscreen
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
        inactive: () => {
          console.warn('Could not load webfonts')
          resolve(false)
        }
      })
    })
  }
}
