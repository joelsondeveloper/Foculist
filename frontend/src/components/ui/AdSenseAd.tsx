"use client"

import { useEffect } from "react"

declare global {
    interface Window {
        adsbygoogle: ({} | [])[]
    }
}

interface AdSenseAdProps {
    slot: string
    format: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal'
    fullWidthResponsive?: boolean
    className?: string
    testMode?: boolean
}

const AdSenseAd: React.FC<AdSenseAdProps> = ({ slot, format = 'auto', fullWidthResponsive = true, className = '', testMode = false }) => {

    const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID

    useEffect(() => {
    if (window.adsbygoogle && adsenseClientId && slot) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("Erro ao carregar anúncio do AdSense:", e);
      }
    }
  }, [adsenseClientId, slot]);

   if (testMode || !adsenseClientId || !slot) {
    return (
      <div
        className={`bg-gray-100 border border-dashed border-gray-400 text-gray-600 flex items-center justify-center p-2 text-center text-sm ${className}`}
        style={{ minHeight: '100px', width: '100%', margin: '10px 0' }}
      >
        [Espaço para Anúncio AdSense - Integração Técnica Feita]
        <br />
        (Aguardando aprovação de conta para exibir anúncios reais)
      </div>
    );
  }

  return (
     <div className={`adsense-container ${className}`} style={{ margin: '10px 0' }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adsenseClientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      ></ins>
    </div>
  )
}

export default AdSenseAd
