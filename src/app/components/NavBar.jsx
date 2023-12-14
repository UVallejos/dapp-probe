"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import NavLink from './NavLink';
import MenuOverlay from './MenuOverlay';
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
import Image from 'next/image';

const navLinks = [
    {   title: "Info",
        href: "#info",
    },
    {   title: "SetUp",
        href: "#setup",
    },
    {   title: "Public Sale",
        href: "#goerli",
    },
    {   title: "WhiteList",
        href: "#whitelist",
    },
];
const NavBar = () => {
    const [navbarOpen, setNavbarOpen] = useState(false);

  return (
    <nav className='fixed top-0 left-0 border border-[#33353F] right-0 z-10 bg-[#121212] bg-opacity-100'>
        <div className='flex container lg:py-4 flex-wrap items-center justify-center mx-auto px-4 py-2'>
            {/*Lógica para activar navbar al clicar en el icono hamburger (Mobile)*/}
            <div className='mobile-menu block md:hidden'>
                    {
                        !navbarOpen ? (
                            <button onClick={()=> setNavbarOpen(true)} className='flex items-center px-3 py-2 
                                border rounded border-slate-200 
                                text-slate-200 hover:text-white 
                                hover:border-white'>

                                <Bars3Icon className='h-8 w-8'/>

                            </button>
                        ) : (
                            <button onClick={()=> setNavbarOpen(false)} className='flex items-center px-3 py-2
                                border rounded border-slate-200
                                 text-slate-200 hover:text-white 
                                 hover:border-white'>
                                <XMarkIcon className='h-8 w-8'/>
                            </button>
                        )
                    }
            </div>
            {/* Barra de Navegación */}
            <div className='menu hidden md:block md:w-auto' id='navbar'>
                <ul className='font-Poppins flex p-4 md:p-0 sm:flex-row md:space-x-8 mt-0'>
                    {
                        navLinks.map((link, index) => (
                            <li key={index}>
                                <NavLink href={link.href} title={link.title}/>
                            </li>
                        ))
                    }
                    <li><w3m-button /></li>
                    <li><w3m-network-button /></li>
                </ul>
            </div>
        </div>
        {/*Se muestra el menu móvil */}
        {navbarOpen ? <MenuOverlay links={navLinks}/> : null}
    </nav>
  )
}

export default NavBar