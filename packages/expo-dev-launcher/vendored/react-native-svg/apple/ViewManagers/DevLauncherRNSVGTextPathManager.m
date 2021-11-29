/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGTextPathManager.h"

#import "DevLauncherRNSVGTextPath.h"

@implementation DevLauncherRNSVGTextPathManager

RCT_EXPORT_MODULE()

- (DevLauncherRNSVGRenderable *)node
{
  return [DevLauncherRNSVGTextPath new];
}

RCT_EXPORT_VIEW_PROPERTY(href, NSString)
RCT_EXPORT_VIEW_PROPERTY(side, NSString)
RCT_EXPORT_VIEW_PROPERTY(method, NSString)
RCT_EXPORT_VIEW_PROPERTY(midLine, NSString)
RCT_EXPORT_VIEW_PROPERTY(spacing, NSString)
RCT_EXPORT_VIEW_PROPERTY(startOffset, DevLauncherRNSVGLength*)

@end
