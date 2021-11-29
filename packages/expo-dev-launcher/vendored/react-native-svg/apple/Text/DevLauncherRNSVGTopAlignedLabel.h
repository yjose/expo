#if TARGET_OS_OSX
#import <React/RCTTextView.h>
@interface DevLauncherRNSVGTopAlignedLabel : NSTextView

@property NSAttributedString *attributedText;
@property NSLineBreakMode lineBreakMode;
@property NSInteger numberOfLines;
@property NSString *text;
@property NSTextAlignment textAlignment;
#else
@interface DevLauncherRNSVGTopAlignedLabel : UILabel
#endif
@end
