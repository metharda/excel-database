"use client"

export const LoadingSpinner = ({ size = "md", text = "Yükleniyor..." }) => {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div className="flex items-center justify-center">
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizes[size]} mx-auto mb-2`}></div>
        <p className="text-gray-500 text-sm">{text}</p>
      </div>
    </div>
  )
}

export const ErrorMessage = ({ title = "Bir hata oluştu", message, onRetry }) => {
  return (
    <div className="text-center py-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
        <div className="text-red-600 mb-2">
          <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">{title}</h3>
        {message && <p className="text-red-600 text-sm mb-4">{message}</p>}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Tekrar Dene
          </button>
        )}
      </div>
    </div>
  )
}

export const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="text-center py-12">
      {Icon && <Icon className="h-16 w-16 mx-auto mb-4 text-gray-300" />}
      <h3 className="text-lg font-medium text-gray-700 mb-2">{title}</h3>
      {description && <p className="text-gray-500 mb-4">{description}</p>}
      {action}
    </div>
  )
}


export const ModernCheckbox = ({ checked, onChange, disabled = false, className = "" }) => {
  const handleClick = (e) => {
    e.stopPropagation() 
    if (!disabled && onChange) {
      onChange(e)
    }
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center cursor-pointer ${disabled ? "cursor-not-allowed" : ""} ${className}`}
      onClick={handleClick}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => {}} 
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={`w-5 h-5 min-w-[20px] min-h-[20px] flex-shrink-0 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
          checked ? "bg-primary-600 border-primary-600 shadow-md" : "bg-white border-gray-300 hover:border-primary-400"
        } ${disabled ? "opacity-50" : ""}`}
      >
        {checked && (
          <svg className="w-3 h-3 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
  )
}
