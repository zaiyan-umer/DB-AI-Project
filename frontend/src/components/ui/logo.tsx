import { Sparkles } from 'lucide-react'

export const Logo = () => {
    return (
        < div className="flex items-center gap-3 mb-4" >
            <div className="w-10 h-10 bg-linear-to-r from-[#667eea] to-[#764ba2] rounded-lg hidden md:flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
            </div>

            <h1 className="text-xl leading-normal! font-bold bg-linear-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                StudySync AI
            </h1>
        </ div>
    )
}
