'''
helper function to find the diff in two different list
'''
def list_diff(list1, list2):
    return (set(list1).symmetric_difference(set(list2)))