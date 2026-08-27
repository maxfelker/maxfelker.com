import { useSound } from '../sound'
import styles from './styles.module.css'

export default function PixelButton({ onClick, className = '', children, ...rest }) {
  const { play } = useSound()
  return (
    <button
      className={`${styles.btn} ${className}`}
      onClick={(e) => { play('click'); onClick?.(e) }}
      {...rest}
    >
      {children}
    </button>
  )
}
