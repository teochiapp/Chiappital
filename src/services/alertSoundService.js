// Reuse the same audio element so a user gesture can unlock subsequent alerts.
let audio;
let playbackVersion = 0;
const getAudio = () => {
  if (!audio) audio = new Audio('/TheEndBegins.mp3');
  return audio;
};

export async function unlockAlertSound() {
  const player = getAudio();
  if (player.loop && !player.paused) return;
  const version = ++playbackVersion;
  player.volume = 0;
  await player.play();
  if (version === playbackVersion) {
    player.pause();
    player.currentTime = 0;
    player.volume = 0.5;
  }
}

export function playAlertSound() {
  playbackVersion += 1;
  const player = getAudio();
  player.volume = 0.5;
  player.loop = true;
  return player.play();
}

export function stopAlertSound() {
  playbackVersion += 1;
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio.loop = false;
}
