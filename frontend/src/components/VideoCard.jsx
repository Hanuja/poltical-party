import { useState } from 'react'
import { Play } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { pickLang } from '../data/mock'

export default function VideoCard({ video }) {
  const { language } = useLanguage()
  const [playing, setPlaying] = useState(false)
  const title = pickLang(video.title, language)

  return (
    <article className="card video-card">
      <div className="video-thumb" style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            style={{ position: 'relative', width: '100%', height: '100%', padding: 0, border: 'none', cursor: 'pointer', background: 'none' }}
            aria-label={`Play ${title}`}
          >
            <img src={video.thumbnail} alt={title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <span className="video-play-btn"><Play size={26} fill="currentColor" /></span>
          </button>
        )}
      </div>
      <div className="card-body">
        {video.category && <span className="badge badge-outline" style={{ marginBottom: 8 }}>{video.category}</span>}
        <h3 style={{ fontSize: '1.05rem' }}>{title}</h3>
      </div>
    </article>
  )
}
