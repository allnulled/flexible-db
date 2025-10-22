{
  const definedProcesses = {};
  const to_js = function(item) {
    switch(item.sentence) {
      case "create":
        return "let " + item.create + " = " + item.as + ";\n";
      case "break process":
        return "break " + item.processId + ";\n";
      case "define block":
        definedProcesses[item.processId] = item.then;
        return "";
      case "assign":
        return item.source " = " + item.value + ";\n";
      case "follow block":
        return definedProcesses[item.processId].trim() + "\n";
      case "throw":
        return "throw " + item.error + ";\n";
      case "always":
        return "" + item.then + "\n";
      case "start process":
        return item.processId + ": {\n  " + item.then.trim() + "\n}\n";
      case "if then":
        let out = "if(" + item.condition + ") {\n  " + item.then.trim() + "\n}";
        for(let i=0; i<item.elseIf.length; i++) {
          const elseIf = item.elseIf[i];
          out += "\nelse if(" + elseIf.condition + ") {\n  " + elseIf.then.trim() + "\n}";
        }
        if(item.else) {
          out += "\nelse {\n  " + item.else.trim() + "\n}\n";
        }
        return out;
      case "event":
        return `await (async (condition) => {\n  if(condition) return false;\n  ${item.then.trim()}\n})((${JSON.stringify(item.model || [])}.indexOf(args[0]) !== -1) && (${JSON.stringify(item.operation || [])}).indexOf(operation) !== -1);\n\n`;
    }
  };
}

Controller_language = Controller_block
Controller_block = ast:Controller_sentence* { return ast.join("") }

Blockpure = Controller_block
Block = Block_1 / Block_2
Block_1 = Controller_sentence

Controller_sentence = 
      Event_sentence
    / Start_process_sentence
    / Break_process_sentence
    / Create_sentence
    / Assign_sentence
    / Always_sentence
    / Define_block_sentence
    / Follow_block_sentence
    / Throw_sentence
    / If_sentence
    / Native_expression

// =======================================
// SENTENCIA IF / ELSE / ELSE IF
// =======================================
If_sentence = 
    _* "if" _+
    condition:Logical_expression
    _+ "then" _+
    then:(Block)
    elseIf:Subsentence_else_if*
    elsez:Subsentence_else?
    { return to_js({ sentence:"if then", condition, then, elseIf, else: elsez }) }

Subsentence_else_if = 
 	_* "else" _+ "if" _+
    condition:Logical_expression
    _+ "then" _+
    then:(Block)
	{ return { condition, then } }

Subsentence_else = 
 	_* "else" _*
    then:(Block)
    { return then }

// =======================================
// OPERACIONES LÓGICAS
// =======================================
// Soporta paréntesis y operadores lógicos: and, or, not
Logical_expression
  = head:Or_expression { return head; }

Or_expression
  = left:And_expression tail:(_+ "or" _+ right:And_expression { return right; })*
    {
      return [left].concat(tail).join(" || ");
    }

And_expression
  = left:Not_expression tail:(_+ "and" _+ right:Not_expression { return right; })*
    {
      return [left].concat(tail).join(" && ");
    }

Not_expression
  = "not" _+ expr:Primary_expression { return "!(" + expr + ")"; }
  / Primary_expression

Primary_expression
  = "(" _* expr:Logical_expression _* ")" { return "(" + expr + ")"; }
  / Native_expression
  / Javascript_id

// =======================================
// CREATE / START / BREAK / EVENT
// =======================================
Create_sentence = 
	_* "create" _+
    create:Javascript_id
    _+ "as" _+
    as:Logical_expression
    { return to_js({ sentence:"create", create, as }) }

Assign_sentence = 
	_* "assign" _+
    source:Javascript_id
    _+ "to" _+
    value:Logical_expression
    { return to_js({ sentence:"assign", source, value }) }

Always_sentence = 
    token1:(_* "always" _+)
    then:Native_expression
    { return to_js({ sentence:"always", then }) }

Define_block_sentence = 
	_* "define block" _+
    processId:Javascript_id
    then:Block_wrapped
    { return to_js({ sentence:"define block", processId, then }) }

Follow_block_sentence = 
	_* "follow block" _+
    processId:Javascript_id
    { return to_js({ sentence:"follow block", processId }) }

Throw_sentence = 
	_* "throw" _+
    error:Native_expression
    { return to_js({ sentence:"throw", error }) }

Start_process_sentence = 
	_* "start" _+ "process" _+
    processId:Javascript_id
    then:Block_wrapped
    { return to_js({ sentence:"start process", processId, then }) }

Break_process_sentence =
	_* "break" _+ "process" _+
    processId:Javascript_id
    { return to_js({ sentence:"break process", processId }) }

// =======================================
// EVENT SENTENCE
// =======================================
Event_sentence = 
    token1:(_* "event on" _+)
    model:Model_subsentence?
    operation:Operation_subsentence
    then:Then_subsentence
    { return to_js({ sentence: "event", model, operation, then }) }

Model_subsentence = 
    _* "model" _+
    model:Text_list
    { return model }

Operation_subsentence = 
    _* "operation" _+
    operation:Text_list
    { return operation }

Then_subsentence = 
    _* "then" _+
    block:Block
    { return block }

// =======================================
// BLOQUES Y TEXTOS
// =======================================
Block_2 = Block_wrapped

Block_wrapped =
    _* "{" _*
    block:Blockpure
    _* "}" _*
    { return block }

Text_list = t1:Text_1 tn:Text_n* { return [t1].concat(tn); }
Text_1 = Text
Text_n = _+ t:Text { return t }
Text = '"' t:Text_content '"' { return t }
Text_content = (!('"') ("\\\"" / .))+ { return text() }

Native_expression = '{{' t:Native_expression_content '}}' { return t }
Native_expression_content = (!('}}') .)+ { return text() }

Javascript_id = [A-Za-z_$] [A-Za-z0-9_$]* { return text() }

// =======================================
// ESPACIADO
// =======================================
_ = __ / ___
__ = "\t" / " "
___ = "\r\n" / "\r" / "\n"
