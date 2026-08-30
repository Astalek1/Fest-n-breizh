import './youTubePlayer.scss'
import { useState } from 'react'
import { getYouTubeEmbedUrl, getYouTubeThumbnail } from '../../utils/youtube'

function YouTubePlayer({ url, title, className }) {
  const [isPlaying, setIsPlaying] = useState(false)

  if (!url) return null

  // Cas d'une vidéo YouTube
  if (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('youtube-nocookie.com')
  ) {
    return isPlaying ? (
      <iframe
        src={`${getYouTubeEmbedUrl(url)}?autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className={className}
      />
    ) : (
      <div className="youtube-player" onClick={() => setIsPlaying(true)}>
        <img
          src={getYouTubeThumbnail(url)}
          alt={title}
          className={className}
          width="320"
          height="180"
        />

        <button className="youtube-player__play" aria-label="Lire la vidéo">
          ▶
        </button>
      </div>
    )
  }

  // Cas d'une vidéo uploadée
  return (
    <video controls className={className}>
      <source src={url} />
    </video>
  )
}

export default YouTubePlayer
