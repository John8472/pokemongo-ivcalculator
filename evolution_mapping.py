# coding=utf8

import sys

# Load data from https://bulbapedia.bulbagarden.net/w/index.php?title=List_of_Pok%C3%A9mon_by_evolution_family&action=edit
# Store in evolution_mapping.txt
# Filter out only the {{lop/ calls

from wiki_template import *


def render(x):
    return ''.join(x)

def print_line(a, b):
    a = [render(x) for x in a]
    b = [render(x) for x in b]

    if a[0].endswith('A') or b[0].endswith('A'):
        return

    sys.stdout.write('[' + str(int(a[0])) + ',' + str(int(b[0])) + '],')
#    sys.stdout.write(' // ' + a[1] + ' => ' + b[1] + '\n')

def compile_lop_evo_call(call):
    if 'lop/evo-Nidoran' == call.name:
        print_line(['029', 'Nidoran♀'], ['030', 'Nidorina'])
        print_line(['030', 'Nidorina'], ['031', 'Nidoqueen'])

        print_line(['032', 'Nidoran♂'], ['033', 'Nidorino'])
        print_line(['033', 'Nidorino'], ['034', 'Nidoking'])

        return

    if 'lop/evo' == call.name:
        idx = 2
        while idx + 3 < len(call.args):
            print_line(call.args[idx:idx+2], call.args[idx+3:idx+5])
            idx += 3
        return

    if 'lop/evo-branch-1' == call.name:
        print_line(call.args[2:4], call.args[5:7])
        print_line(call.args[2:4], call.args[8:10])

        return

    if 'lop/evo-branch-2' == call.name:
        print_line(call.args[2:4], call.args[5:7])
        print_line(call.args[5:7], call.args[8:10])
        print_line(call.args[5:7], call.args[11:13])

        return

    if 'lop/evo-branch-multi' == call.name:
        idx = 5
        while idx < len(call.args):
            print_line(call.args[2:4], call.args[idx:idx + 2])

            idx += 3
        return


    if 'lop/evo-Unown' == call.name:
        return

    if 'lop/evo-group' == call.name:
        return

    sys.stderr.write('UNRECOGNIZED TEMPLATE CALL: ' + repr(call) + '\n')

if '__main__' == __name__:
    with open('evolution_mapping.txt', 'r') as tf:
        data = tf.read()

    x = Parser(data)
    for part in x.parse():
        if isinstance(part, TemplateCall):
            compile_lop_evo_call(part)

