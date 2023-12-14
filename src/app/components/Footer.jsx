import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

const Footer = () => {
  return (
    <footer className='footer
    
    bg-[#121212] 
        border z-10 border-t-[#33353F] 
        border-l-transparent 
        border-r-transparent text-white'>
        <div className='container p-12 flex justify-between text-2xl md:text-5xl text-white'>
            <div></div>
            <p>
            <Link target='_blank' href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app">
              
              <Image
                src="/vercel.svg"
                alt="Vercel Logo"
                className="dark:invert"
                width={100}
                height={24}
                priority
              />
            </Link>
            </p>
            
        </div>
    </footer>
)
}

export default Footer