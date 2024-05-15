import Blob "mo:base/Blob";
import Cycles "mo:base/ExperimentalCycles";
import Text "mo:base/Text";
import { print } = "mo:base/Debug";
import Timer "mo:base/Timer";
import Bool "mo:base/Bool";
// import JSON "mo:serde/JSON";
import Trie "mo:base/Trie";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Types "Types";

actor {

  var requirePriceUpdate : Bool = true;
  var icpPrice : Text = "";

  /**
   * Application State
   */

  // The users data store.
  private stable var users : Trie.Trie<Types.Principal, Types.User> = Trie.empty();

  /**
   * High-Level API
   */

  public shared query ({ caller }) func getUserPrincipal(name : Text) : async Text {
    print(debug_show ("getUserPrincipal: ") # Principal.toText(caller));
    return "Hello, " # name # "! " # "Your PrincipalId is: " # Principal.toText(caller);
  };

  // Create a user.
  public shared ({ caller }) func createUser(user : Types.User) : async ?Types.User {
    print(debug_show ("createUser: ") # Principal.toText(caller));
    var principal = Principal.toText(caller);
    var _user = await getUser(principal);
    if (_user == null) {
      users := Trie.replace(
        users,
        key(principal),
        Text.equal,
        ?user,
      ).0;
      _user := ?user;
      print(debug_show ("Creating new user: ") # debug_show (user));
    } else {
      print(debug_show ("User already exists: ") # debug_show (_user));
    };
    return _user;
  };

  public shared ({ caller }) func updateUser(_user : Types.User) : async Bool {
    print(debug_show ("updateUser: ") # Principal.toText(caller));
    var principal = Principal.toText(caller);
    let result = Trie.find(users, key(principal), Text.equal);
    let exists = Option.isSome(result);
    if (exists) {
      users := Trie.replace(
        users,
        key(principal),
        Text.equal,
        ?_user,
      ).0;
      // print(debug_show ("Updated user: "));
      print(debug_show ("Updated user: ") # debug_show (_user));
    } else {
      print(debug_show ("User not found. nothing to update: " #principal));
    };
    return exists;
  };

  public query func getUser(principal : Types.Principal) : async ?Types.User {
    return Trie.find(users, key(principal), Text.equal);
  };

  // Create a trie key from a superhero identifier.
  private func key(x : Types.Principal) : Trie.Key<Types.Principal> {
    return { hash = Text.hash(x); key = x };
  };

  public query func transform(raw : Types.TransformArgs) : async Types.CanisterHttpResponsePayload {
    let transformed : Types.CanisterHttpResponsePayload = {
      status = raw.response.status;
      body = raw.response.body;
      headers = [
        {
          name = "Content-Security-Policy";
          value = "default-src 'self'";
        },
        { name = "Referrer-Policy"; value = "strict-origin" },
        { name = "Permissions-Policy"; value = "geolocation=(self)" },
        {
          name = "Strict-Transport-Security";
          value = "max-age=63072000";
        },
        { name = "X-Frame-Options"; value = "DENY" },
        { name = "X-Content-Type-Options"; value = "nosniff" },
      ];
    };
    transformed;
  };

  public shared func getPriceFromCoinBase(coin : Text) : async Text {

    //First, declare the management canister
    let ic : Types.IC = actor ("aaaaa-aa");

    //Next, you need to set the arguments for our GET request

    // Start with the URL and its query parameters

    let host : Text = "api.coinbase.com";
    let url = "https://" # host # "/v2/prices/" # coin # "/spot/";

    // Prepare headers for the system http_request call.

    let request_headers = [
      { name = "Host"; value = host # ":443" },
      { name = "User-Agent"; value = "exchange_rate_canister" },
    ];

    // Next, you define a function to transform the request's context from a blob datatype to an array.

    let transform_context : Types.TransformContext = {
      function = transform;
      context = Blob.fromArray([]);
    };

    // Finally, define the HTTP request.

    let http_request : Types.HttpRequestArgs = {
      url = url;
      max_response_bytes = null; //optional for request
      headers = request_headers;
      body = null; //optional for request
      method = #get;
      transform = ?transform_context;
    };

    // Now, you need to add some cycles to your call, since cycles to pay for the call must be transferred with the call.
    // The way Cycles.add() works is that it adds those cycles to the next asynchronous call.
    // "Function add(amount) indicates the additional amount of cycles to be transferred in the next remote call".
    // See: https://internetcomputer.org/docs/current/references/ic-interface-spec/#ic-http_request

    Cycles.add<system>(1_603_105_200);

    // Now that you have the HTTP request and cycles to send with the call, you can make the HTTP request and await the response.

    let http_response : Types.HttpResponsePayload = await ic.http_request(http_request);

    // Once you have the response, you need to decode it. The body of the HTTP response should come back as [Nat8], which needs to be decoded into readable text.
    // To do this, you:
    //  1. Convert the [Nat8] into a Blob
    //  2. Use Blob.decodeUtf8() method to convert the Blob to a ?Text optional
    //  3. Use a switch to explicitly call out both cases of decoding the Blob into ?Text

    let response_body : Blob = Blob.fromArray(http_response.body);
    let decoded_text : Text = switch (Text.decodeUtf8(response_body)) {
      case (null) { "No value returned" };
      case (?y) { y };
    };

    requirePriceUpdate := false;
    decoded_text;
  };

  public shared ({ caller }) func getICPPrice() : async Text {
    // public shared function, to update in all nodes in the subnet
    // requiring price to be updated since we have an active user calling this method through frontend canister
    print(debug_show ("getICPPrice: ") # Principal.toText(caller));

    requirePriceUpdate := true;
    icpPrice;
  };

  private func recurringICPPriceUpdate() : async () {
    if (requirePriceUpdate) {
      print("Fetching price in timer, requirePriceUpdate value is true");
      icpPrice := await getPriceFromCoinBase("ICP-USD");
      print(debug_show (icpPrice));
      // let btcPrice : Text = await getPriceFromCoinBase("BTC-USD");
      // print(debug_show (btcPrice));

      // let #ok(blob) = JSON.fromText(btcPrice, null); // you probably want to handle the error case here :)
      // let coinbaseResponse : ?[Types.CoinbaseResponse] = from_candid (blob);

      // let UserKeys = ["amount", "base", "currency"];
      // print(debug_show (JSON.toText(to_candid (coinbaseResponse), UserKeys, null)));
      // print(debug_show ((coinbaseResponse)));
    } else {
      print("No active users so price is not being updated");
    };
  };

  ignore Timer.recurringTimer<system>(#seconds 4, recurringICPPriceUpdate);
};
