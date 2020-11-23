//
//  ABI40_0_0EXAnimationViewManager.m
//  LottieABI40_0_0ReactNative
//
//  Created by Leland Richardson on 12/12/16.
//  Copyright © 2016 Airbnb. All rights reserved.
//

#import "ABI40_0_0EXAnimationViewManager.h"

#import "ABI40_0_0EXContainerView.h"

// import ABI40_0_0RCTBridge.h
#if __has_include(<ABI40_0_0React/ABI40_0_0RCTBridge.h>)
#import <ABI40_0_0React/ABI40_0_0RCTBridge.h>
#elif __has_include("ABI40_0_0RCTBridge.h")
#import "ABI40_0_0RCTBridge.h"
#else
#import "ABI40_0_0React/ABI40_0_0RCTBridge.h"
#endif

// import ABI40_0_0RCTUIManager.h
#if __has_include(<ABI40_0_0React/ABI40_0_0RCTUIManager.h>)
#import <ABI40_0_0React/ABI40_0_0RCTUIManager.h>
#elif __has_include("ABI40_0_0RCTUIManager.h")
#import "ABI40_0_0RCTUIManager.h"
#else
#import "ABI40_0_0React/ABI40_0_0RCTUIManager.h"
#endif

#import <Lottie/Lottie.h>

@implementation ABI40_0_0EXAnimationViewManager

ABI40_0_0RCT_EXPORT_MODULE(LottieAnimationView)

- (UIView *)view
{
  return [ABI40_0_0EXContainerView new];
}

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"VERSION": @1,
  };
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onAnimationFinish, ABI40_0_0RCTBubblingEventBlock);

ABI40_0_0RCT_EXPORT_METHOD(play:(nonnull NSNumber *)ABI40_0_0ReactTag
                  fromFrame:(nonnull NSNumber *) startFrame
                  toFrame:(nonnull NSNumber *) endFrame)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI40_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI40_0_0ReactTag];
    if (![view isKindOfClass:[ABI40_0_0EXContainerView class]]) {
      ABI40_0_0RCTLogError(@"Invalid view returned from registry, expecting LottieContainerView, got: %@", view);
    } else {
      ABI40_0_0EXContainerView *lottieView = (ABI40_0_0EXContainerView *)view;
      LOTAnimationCompletionBlock callback = ^(BOOL animationFinished){
        if (lottieView.onAnimationFinish) {
          lottieView.onAnimationFinish(@{@"isCancelled": animationFinished ? @NO : @YES});
        }
      };
      if ([startFrame intValue] != -1 && [endFrame intValue] != -1) {
        [lottieView playFromFrame:startFrame toFrame:endFrame withCompletion:callback];
      } else {
        [lottieView play:callback];
      }
    }
  }];
}

ABI40_0_0RCT_EXPORT_METHOD(reset:(nonnull NSNumber *)ABI40_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI40_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI40_0_0ReactTag];
    if (![view isKindOfClass:[ABI40_0_0EXContainerView class]]) {
      ABI40_0_0RCTLogError(@"Invalid view returned from registry, expecting LottieContainerView, got: %@", view);
    } else {
      ABI40_0_0EXContainerView *lottieView = (ABI40_0_0EXContainerView *)view;
      [lottieView reset];
    }
  }];
}

@end
