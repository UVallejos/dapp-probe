import React from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import ConnectButton from './components/ConnectButton'
import  Title  from "./components/Title"
import NavBar from './components/NavBar'
import Footer from './components/Footer'

function index() {
  
  return (
    <main className="flex min-h-screen flex-col bg-[#121212]">
      <NavBar></NavBar>
      <div className='container mt-24 mx-auto px-12 py-4'>
        <Title
        title={"Info"}
        id={"info"}
        
        />
         <Title
        title={"SetUp"}
        id={"setup"}
        />
        <Title
        title={"Public Sale Goerli"}
        id={"goerli"}
        />
        <Title
        title={"WhiteList Mumbai"}
        id={"whitelist"}
        />
      </div>
      <Footer></Footer>
    </main>
    
  )
}

export default index
