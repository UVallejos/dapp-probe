
import React from 'react'

const Title = ({title, id}) => {
  return (
    <section id={id}>
        <h2 className='text-center  text-4xl sm:text-5xl lg:text-6xl text-white mt-4 mb-4'>
            <span className='font-sans text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-secondary-100'>
                {title}
            </span>
        </h2>
    </section>
  )
}

export default Title