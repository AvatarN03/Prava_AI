"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

import Logo from '../custom/Logo';
import ThemeToggle from '../custom/ThemeToggle';
import LanguageSelector from '../custom/LanguageSelector';
import ProfileCard from '../custom/ProfileCard';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

import { useAuth } from '@/context/useAuth'

import { getUserInitials } from '@/lib/utils/nameInitial'
import { cn } from '@/lib/utils'
import { landingPageMenus } from '@/lib/constants';
import { Accessibility } from '../custom/Accessibility';

const Navbar = () => {
    const { user, profile } = useAuth()
    const [showProfileModal, setShowProfileModal] = useState(false)
    const [navbg, setNavBg] = useState(false);

    useEffect(() => {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 30) {
                setNavBg(true)
            } else {
                setNavBg(false)
            }
        })
    }, [navbg])



    return (
        <>
            <header className={cn(" h-16 sticky inset-0 font-serif backdrop-blur-md z-50", navbg ? "bg-transparent backdrop-blur-2xl shadow-md" : "shadow-none bg-card")}>
                <div className="flex w-full justify-between items-center h-full p-3 max-w-7xl mx-auto">

                    <div className="flex-1">
                        <Logo />
                    </div>

                    <nav className='hidden md:block'>
                        <ul className='flex gap-4 justify-center items-center text-slate-600 dark:text-slate-300'>
                            {
                                landingPageMenus.map((menu, index) => (
                                    <Link href={menu.href} key={index}>
                                        <li className="text-sm tracking-wider transition-all hover:font-bold hover:text-slate-700 dark:hover:text-slate-100">
                                            {menu.name}
                                        </li>
                                    </Link>
                                ))
                            }
                        </ul>
                    </nav>

                    <div className="flex flex-1 gap-2 justify-end items-center">

                        {/* <ThemeToggle />
                        <LanguageSelector /> */}
                        <Accessibility />
                        {user ? (
                            <div className="flex items-center gap-1 md:gap-2">
                                <Link href="/dashboard">
                                    <Button className="p-1 md:p-2">
                                        Console
                                    </Button>
                                </Link>

                                <button
                                    onClick={() => setShowProfileModal(true)}
                                    className=" rounded-full  cursor-pointer border-2 border-purple-500"
                                >
                                    <Avatar className="w-8 h-8 ">
                                        <AvatarImage
                                            src={profile?.avatarUrl || "/profile.png"}
                                            alt={profile?.name || "Profile"}
                                            className={"object-cover"}
                                        />
                                        <AvatarFallback className="text-xs font-semibold">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            </div>
                        ) : (
                            <Link href={'/auth?continueTo=/dashboard'}>
                                <Button className='cursor-pointer'>Log In</Button>
                            </Link>
                        )}

                    </div>
                </div>
            </header>

            {/* Profile Modal */}
            <ProfileCard modal={showProfileModal} setModal={setShowProfileModal} />
        </>
    )
}

export default Navbar