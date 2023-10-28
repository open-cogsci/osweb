let audioContext = null;

// A singleton function to expose the same audio context throughout the app
export function getAudioContext() {
  if (audioContext === null) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioContext
}
