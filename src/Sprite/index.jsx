import styles from './styles.module.css'

// Sprite-sheet animation, pure CSS: the sheet is a horizontal strip of frames,
// background-position steps through it with steps(n). No canvas, no game loop.
export default function Sprite({
  sheet,        // URL of horizontal strip PNG
  frameWidth,   // native px of one frame
  frameHeight,
  frames,
  fps = 8,
  scale = 1,    // integer zoom
  playing = true,
  className = '',
  style,
  ...rest
}) {
  return (
    <div
      className={`${styles.sprite} ${className}`}
      style={{
        '--fw': frameWidth,
        '--fh': frameHeight,
        '--n': frames,
        '--px': scale,
        '--dur': `${frames / fps}s`,
        '--play': playing ? 'running' : 'paused',
        backgroundImage: `url(${sheet})`,
        ...style,
      }}
      {...rest}
    />
  )
}
