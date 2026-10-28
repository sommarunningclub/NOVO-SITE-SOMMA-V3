export default function CheckoutLoading() {
  return (
    <main className="bg-black">
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        {/* Animated gradient circle */}
        <div className="relative w-24 h-24 mb-12">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, #ff2c03 0%, transparent 70%)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          <div
            className="absolute inset-2 rounded-full border border-[#ff2c03]/30"
            style={{
              animation: "spin 3s linear infinite",
            }}
          />
          <div
            className="absolute inset-4 rounded-full border-t border-[#ff2c03]"
            style={{
              animation: "spin 1.5s linear infinite reverse",
            }}
          />
        </div>

        {/* Text */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-light text-white">Carregando checkout</h2>
          <p className="text-sm text-white/50">Preparando seu ambiente de pagamento</p>
        </div>

        {/* Animated dots */}
        <div className="flex gap-1 mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#ff2c03]"
              style={{
                animation: `bounce 1.4s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.4; }
          }
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(1); opacity: 0.5; }
            40% { transform: scale(1.2); opacity: 1; }
          }
        `}</style>
      </div>
    </main>
  )
}
