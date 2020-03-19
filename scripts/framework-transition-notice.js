#!/usr/bin/env node
let message = "";

message += "WARNING: Nexus is becoming a framework\n";
message += "\n";
message += "Starting from 0.20.0 the nexus package is a framework.\n";
message += "\n";
message += "To learn more about this transition please see\n";
message += "\n";
message += "    https://nxs.li/schema-to-framework/about\n";
message += "\n";
message += "To learn more about the new Neuxs framework see\n";
message += "\n";
message += "    https://nexusjs.org\n";
message += "\n";
message += "To migrate to the Nexus framework see\n";
message += "\n";
message += "    https://nxs.li/schema-to-framework/migrate\n";
message += "\n";
message += "To continue using the Nexus Schema package please install \n";
message += "\n";
message += "    @nexus/schema\n";
message += "\n";

process.stdout.write(message);
