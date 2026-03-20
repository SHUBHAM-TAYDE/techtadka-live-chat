const COLORS = [
  'bg-violet-600', 'bg-indigo-600', 'bg-blue-600',
  'bg-teal-600',   'bg-emerald-600','bg-rose-600',
  'bg-orange-600', 'bg-amber-600',
]

const hashStr = (str) => {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i)
  return Math.abs(h)
}

const Avatar = ({ username = '', size = 'md', online = false, className = '' }) => {
  const color   = COLORS[hashStr(username) % COLORS.length]
  const initial = username.charAt(0).toUpperCase()

  const sizes = {
    sm:  'w-7 h-7 text-xs',
    md:  'w-9 h-9 text-sm',
    lg:  'w-11 h-11 text-base',
    xl:  'w-14 h-14 text-lg',
  }

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <div className={`avatar ${sizes[size] || sizes.md} ${color}`}>
        {initial}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-online rounded-full border-2 border-base" />
      )}
    </div>
  )
}

export default Avatar
