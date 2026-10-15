import { PrintFeatureScreen } from './PrintFeatureScreen'
import './styles/print-feature.css'
import './styles/proxy-printer-workspace.css'

/** Full-viewport print feature host — styles and layout are isolated under .print-feature-root. */
export default function PrintFeaturePage() {
  return (
    <div className="print-feature-root">
      <PrintFeatureScreen />
    </div>
  )
}
