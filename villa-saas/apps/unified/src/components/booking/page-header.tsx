'use client'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backgroundImage?: string
}

export function PageHeader({ 
  title, 
  subtitle, 
  backgroundImage = '/images/hero-default.jpg' 
}: PageHeaderProps) {
  return (
    <section 
      className="relative h-[70vh] flex items-center justify-center bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url('${backgroundImage}')` }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div className="relative text-center text-white px-4">
        <h1 className="font-playfair text-6xl mb-6 leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-xl max-w-2xl mx-auto leading-relaxed opacity-90">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}