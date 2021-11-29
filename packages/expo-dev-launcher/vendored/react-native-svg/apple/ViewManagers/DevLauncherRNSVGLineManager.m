/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGLineManager.h"

#import "DevLauncherRNSVGLine.h"
#import "RCTConvert+DevLauncherRNSVG.h"

@implementation DevLauncherRNSVGLineManager

RCT_EXPORT_MODULE()

- (DevLauncherRNSVGRenderable *)node
{
  return [DevLauncherRNSVGLine new];
}

RCT_EXPORT_VIEW_PROPERTY(x1, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(y1, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(x2, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(y2, DevLauncherRNSVGLength*)

@end
