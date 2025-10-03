import Foundation
import PassKit
import UIKit

@objc(RNAddToWalletButtonView)
class RNAddToWalletButtonView: UIView {
  private var addPassButton = PKAddPassButton(addPassButtonStyle: .blackOutline)
  private let defaultWidth: CGFloat = 120
  private let defaultHeight: CGFloat = 40
  
  @objc var buttonStyle: NSString = "" {
    didSet {
      updateButtonStyle()
    }
  }
  
  @objc var borderRadius: CGFloat = 4.0 {
    didSet {
      applyBorderRadius()
    }
  }
  
  override init(frame: CGRect) {
    super.init(frame: frame)
    setupButton()
  }
  
  required init?(coder: NSCoder) {
    super.init(coder: coder)
    setupButton()
  }
  
  private func setupButton() {
    addSubview(addPassButton)
    updateButtonStyle()
  }
  
  private func applyBorderRadius() {
    let maxRadius = addPassButton.bounds.height / 2
    let radius = min(borderRadius, maxRadius)
    
    addPassButton.layer.cornerRadius = radius
    addPassButton.layer.masksToBounds = true
    addPassButton.clipsToBounds = true
  }
  
  override func layoutSubviews() {
    super.layoutSubviews()
    
    let width = bounds.width > 0 ? bounds.width : defaultWidth
    let height = bounds.height > 0 ? bounds.height : defaultHeight
    
    addPassButton.frame = CGRect(x: 0, y: 0, width: width, height: height)
    self.frame = addPassButton.frame
    
    applyBorderRadius()
  }
  
  private func updateButtonStyle() {
    let style: PKAddPassButtonStyle = (buttonStyle.lowercased == "black") ? .black : .blackOutline
    addPassButton.removeFromSuperview()
    addPassButton = PKAddPassButton(addPassButtonStyle: style)

    addSubview(addPassButton)
    setNeedsLayout()
  }
}
