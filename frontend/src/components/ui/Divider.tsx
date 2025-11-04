import React from 'react'

const Divider = () => {
  return (
    <div className='flex items-center'>
      <div className="line border-b border-muted-foreground flex-1"></div>
      <p className='w-fit mx-auto px-2 text-sm'>or</p>
      <div className="line border-b border-muted-foreground flex-1"></div>
    </div>
  )
}

export default Divider
