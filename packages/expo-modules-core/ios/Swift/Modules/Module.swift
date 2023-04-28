// Copyright 2021-present 650 Industries. All rights reserved.

/**
 `BaseModule` is just a stub class that fulfils `AnyModule` protocol requirement of public default initializer,
 but doesn't implement that protocol explicitly, though — it would have to provide a definition which would require
 other modules to use `override` keyword in the function returning the definition.
 */
open class BaseModule {
  public private(set) weak var appContext: AppContext?

  public var javaScriptWeakObject: JavaScriptWeakObject?

  public var javaScriptObject: JavaScriptObject {
    get throws {
      if let object = javaScriptWeakObject?.lock() {
        return object
      }
      throw JavaScriptObjectUnavailableException(String(describing: Self.self))
    }
  }

  @available(*, unavailable, message: "Module's initializer cannot be overriden, use \"onCreate\" definition component instead.")
  public init() {}

  required public init(appContext: AppContext) {
    self.appContext = appContext
  }

  /**
   Sends an event with given name and payload to JavaScript.
   */
  public func sendEvent(_ eventName: String, _ payload: [String: Any?] = [:]) {
    // Send the event to the global event emitter that can be captured from the modules proxy (bridge)
    appContext?.eventEmitter?.sendEvent(withName: eventName, body: payload)

    appContext?.runOnJavaScriptThread { [weak self] in
      guard let self, let object = try? self.javaScriptObject else {
        log.error("Unable to get a JavaScript object for module '\(String(describing: Self.self))'")
        return
      }

      // Send the event to the underlying JavaScript object (JSI)
      object.emitEvent(eventName, payload: payload)
    }
  }
}

/**
 An alias for `AnyModule` extended by the `BaseModule` class that provides public default initializer.
 */
public typealias Module = AnyModule & BaseModule

/**
 An exception thrown when the module's underlying JavaScript object is not available.
 That is, when it's been garbage-collected already or the remote debugger is on.
 */
private final class JavaScriptObjectUnavailableException: GenericException<String> {
  override var reason: String {
    return "JavaScript object for module '\(param)' is no longer available"
  }
}
