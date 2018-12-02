# coding=utf8

import sys

# Load data from https://bulbapedia.bulbagarden.net/w/index.php?title=List_of_Pok%C3%A9mon_by_National_Pok%C3%A9dex_number&action=edit
# Store in name_mapping.txt
# Filter out only the {{rdex/ calls

from wiki_template import *

def compile_lop_evo_call(call):
    if 'rdex' == call.name:
        idx = call.args[1][0]

        c = 0
        while idx[len(idx) - c - 1] < '0' or '9' < idx[len(idx) - c - 1]:
            c += 1

        var = 'null'
        if 0 < c:
            var = '"' + idx[-c:] + '"'
            idx = idx[:-c]

        if var != 'null':
            return

        sys.stdout.write('[' + str(int(idx)) + ',"' + str(call.args[2][0]) + '"],')

        return

    sys.stderr.write('UNRECOGNIZED TEMPLATE CALL: ' + repr(call) + '\n')

if '__main__' == __name__:
    with open('name_mapping.txt', 'r') as tf:
        data = tf.read()

    x = Parser(data)
    for part in x.parse():
        if isinstance(part, TemplateCall):
            compile_lop_evo_call(part)

