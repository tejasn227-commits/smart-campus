import type { SVGProps } from 'react'
type IconProps = SVGProps<SVGSVGElement>
export const Logo=(p:IconProps)=><svg viewBox="0 0 28 28" fill="none" aria-hidden="true" {...p}><path d="M14 1.6 20.3 8 14 14.4 7.7 8 14 1.6Z" fill="#FF6A00"/><path d="m6.4 9.3 6.3 6.4-6.3 6.4L.1 15.7l6.3-6.4Z" fill="#FF3D00"/><path d="m21.6 9.3 6.3 6.4-6.3 6.4-6.3-6.4 6.3-6.4Z" fill="#FF9A2E"/></svg>
export const Globe=(p:IconProps)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true" {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.7 3.7 9S14.5 18.4 12 21c-2.5-2.6-3.7-5.7-3.7-9S9.5 5.6 12 3Z"/></svg>
export const Chevron=(p:IconProps)=><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true" {...p}><path d="m3 4.5 3 3 3-3"/></svg>
export const ArrowRight=(p:IconProps)=><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="M4 10h12M11 5l5 5-5 5"/></svg>
export const Menu=(p:IconProps)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" {...p}><path d="M4 8h16M4 16h16"/></svg>
export const Close=(p:IconProps)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" {...p}><path d="m6 6 12 12M18 6 6 18"/></svg>
export const partners=['BookStore','zantic','Crona','Mercury','Wagon'].map(name=>({name,mark:<span className="text-[var(--flame-lit)]">◈</span>}))
