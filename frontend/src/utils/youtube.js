export function getYouTubeEmbedUrl(url) {
  if (!url) return ''

  if (
    !url.includes('youtube.com') &&
    !url.includes('youtu.be') &&
    !url.includes('youtube-nocookie.com')
  ) {
    return url
  }

  let videoId = ''

  // Format : https://www.youtube.com/watch?v=...
  if (url.includes('watch?v=')) {
    videoId = url.split('watch?v=')[1].split('&')[0]
  }

  // Format : https://youtu.be/...
  else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0]
  }

  // Format : https://www.youtube.com/embed/... ou youtube-nocookie.com/embed/...
  else if (url.includes('/embed/')) {
    videoId = url.split('/embed/')[1].split('?')[0]
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}`
}
