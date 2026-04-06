import Footer from '@/components/Marketing/Footer'
import Navbar from '@/components/Marketing/Navbar'

const LayoutMarketing = ({ children }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-300 via-indigo-200 to-purple-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <Navbar />

            {children}
            <Footer />
        </div>

    )
}

export default LayoutMarketing