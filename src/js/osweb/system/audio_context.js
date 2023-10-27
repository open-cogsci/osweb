let audioContext = null;

// A singleton function to expose the same audio context throughout the app
export function getAudioContext() {
  if (audioContext === null) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioContext.state === 'suspended') {
    console.log('resuming suspended audio context')
    audioContext.resume()
  }
  return audioContext
}
