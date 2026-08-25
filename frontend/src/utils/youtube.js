function getYouTubeVideoId(url) {
  if (!url) return ''

  if (
    !url.includes('youtube.com') &&
    !url.includes('youtu.be') &&
    !url.includes('youtube-nocookie.com')
  ) {
    return ''
  }

  // Format : https://www.youtube.com/watch?v=...
  if (url.includes('watch?v=')) {
    return url.split('watch?v=')[1].split('&')[0]
  }

  // Format : https://youtu.be/...
  else if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1].split('?')[0]
  }

  // Format : https://www.youtube.com/embed/... ou youtube-nocookie.com/embed/...
  else if (url.includes('/embed/')) {
    return url.split('/embed/')[1].split('?')[0]
  }

  return ''
}

export function getYouTubeEmbedUrl(url) {
  const videoId = getYouTubeVideoId(url)

  if (!videoId) return url

  return `https://www.youtube-nocookie.com/embed/${videoId}`
}

export function getYouTubeThumbnail(url) {
  const videoId = getYouTubeVideoId(url)

  if (!videoId) return ''

  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}
